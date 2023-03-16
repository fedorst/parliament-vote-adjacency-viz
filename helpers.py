from typing import Tuple, Dict, Any, Union

import requests
import pandas as pd
import os
from IPython.display import HTML, display
import time

from pandas import DataFrame

coalitions = {
    "52": ["2022-07-18", "2023-03-14"],
    "51": ["2021-01-26", "2022-07-17"],
    "50": ["2019-04-29", "2021-01-25"],
    "49": ["2016-11-23", "2019-04-28"],
    "48": ["2015-04-09", "2016-11-22"],
    "47": ["2014-03-26", "2015-04-08"]
}


def get_payload(url, verbose=False):
    response = requests.get(url)
    if verbose:
        print(url)
    if response.status_code != 200:
        raise Exception(
            f"Something went wrong with the request. Request returned {response.status_code} : '{response.reason}'.\nCheck the url {url}.")
    payload = response.json()
    return payload


def get_session_json(start_date: str, end_date: str) -> dict:
    url = (
        'https://api.riigikogu.ee/api/votings?'
        f'startDate={start_date}'
        f'&endDate={end_date}'
        '&lang=et'
    )
    return get_payload(url)


def transform_session_json(session_json: dict) -> pd.DataFrame:
    vote_dict = {}
    for session in session_json:
        title = session["title"]
        date = session["title"].split(", ")[-1]
        votes = session["votings"]
        for vote in votes:
            vote_dict[vote["uuid"]] = {
                "sessionTitle": title,
                "sessionDate": date,
                "description": vote["description"]
            }
    session_data = pd.DataFrame.from_dict(vote_dict, orient="index")
    return session_data


def get_session_path(coalition: str) -> str:
    return f"coalition_{coalition}/sessionData.parquet"


def get_session_data(coalition: str) -> pd.DataFrame:
    coalition_path = f"coalition_{coalition}"
    if coalition_path not in os.listdir():
        os.mkdir(coalition_path)
    session_path = get_session_path(coalition)
    if session_path.split("/")[-1] in os.listdir(coalition_path):
        print(f"Session data already exists in {session_path}")
        return pd.read_parquet(session_path)

    start_date, end_date = coalitions[coalition]
    session_json = get_session_json(start_date, end_date)
    session_data = transform_session_json(session_json)
    print(f"Saving session data to {session_path}")
    session_data.to_parquet(session_path)
    return session_data


def get_vote_json(vote_id: str):
    url = f"https://api.riigikogu.ee/api/votings/{vote_id}?lang=et"
    return get_payload(url, verbose=False)


def get_voter_dict(vote_json: dict) -> Tuple[Dict[Any, Any], Dict[str, Union[str, Any]]]:
    voters = vote_json["voters"]
    voters_votes = {}
    for voter in voters:
        name = voter["fullName"]
        decision_code = voter["decision"]["code"]
        # faction = voter["faction"]["name"]
        voters_votes[name] = decision_code

    vote_metadata = {
        "description": vote_json["description"],
        "draftLink": f"https://www.riigikogu.ee/tegevus/eelnoud/eelnou/{vote_json['relatedDraft']['uuid']}" if "relatedDraft" in vote_json else None,
        "draftTitle": vote_json['relatedDraft']['title'] if "relatedDraft" in vote_json else None
    }
    return voters_votes, vote_metadata


def pull_coalition_votes(session_data: pd.DataFrame, excluded_vote_types=["Kohaloleku kontroll"]) -> Tuple[
    DataFrame, DataFrame]:
    vote_ids = session_data[~session_data.description.isin(excluded_vote_types)].index
    all_votes_dict = {}
    all_votes_metadata = {}
    all_ids_length = len(vote_ids)

    out = display(progress(0, 100), display_id=True)

    for i in range(all_ids_length):
        vote_id = vote_ids[i]
        vote_json = get_vote_json(vote_id)
        voter_dict, vote_metadata = get_voter_dict(vote_json)
        all_votes_dict[vote_id] = voter_dict
        all_votes_metadata[vote_id] = vote_metadata

        out.update(progress(i, all_ids_length))
    coalition_votes_df = pd.DataFrame.from_dict(all_votes_dict).transpose()
    coalition_votes_metadata = pd.DataFrame.from_dict(all_votes_metadata).transpose()
    return coalition_votes_df, coalition_votes_metadata


def get_coalition_votes(session_data, selected_coalition):
    selected_coalition_folder = f"coalition_{selected_coalition}"
    if "votes.parquet" in os.listdir(selected_coalition_folder) and "metadata.parquet" in os.listdir(
            selected_coalition_folder):
        print(f"Votes df found in {selected_coalition_folder}/votes.parquet")
        coalition_votes_df = pd.read_parquet(f"{selected_coalition_folder}/votes.parquet")
        coalition_votes_metadata = pd.read_parquet(f"{selected_coalition_folder}/metadata.parquet")

    else:
        print("Pulling coalition votes from API")
        coalition_votes_df, coalition_votes_metadata = pull_coalition_votes(session_data,
                                                                            excluded_vote_types=["Kohaloleku kontroll"])
        coalition_votes_df.to_parquet(f"{selected_coalition_folder}/votes.parquet")
        coalition_votes_metadata.to_parquet(f"{selected_coalition_folder}/metadata.parquet")
        print(f"Votes df saved to {selected_coalition_folder}/votes.parquet")

    return coalition_votes_df, coalition_votes_metadata


def get_adjacency_matrix_df(votes_df: pd.DataFrame) -> pd.DataFrame:
    processed_names = set()
    adjacency_matrix = {}
    for name1 in votes_df.columns:
        adjacency_matrix[name1] = {}
        for name2 in votes_df.columns:
            # if name2 == name1:
            #  continue
            if name2 not in adjacency_matrix:
                adjacency_matrix[name2] = {}
            if name2 in adjacency_matrix[name1]:
                adjacency_matrix[name2][name1] = adjacency_matrix[name1][name2]
            else:
                adjacency = (votes_df[name1] == votes_df[name2]).dropna()
                adjacency_sum = adjacency.sum()
                adjacency_matrix[name1][name2] = adjacency_sum
                # print(name1, name2, adjacency.mean())
            processed_names.add(name1)
    adjacency_matrix_df = pd.DataFrame.from_dict(adjacency_matrix)
    return adjacency_matrix_df


def progress(value, max=100):
    return HTML("""
        <progress
            value='{value}'
            max='{max}',
            style='width: 100%'
        >
            {value}
        </progress>
    """.format(value=value, max=max))


def get_fractions():
    path = "fractions.parquet"
    if path in os.listdir():
        fractions_df = pd.read_parquet(path)
        print(f"Fractions data already exists in {path}.")
    else:
        usergroups_json = get_payload("https://api.riigikogu.ee/api/usergroups")
        party_groups = [g for g in usergroups_json if g['type']['code'] == 'FRAKTSIOON']
        for g in party_groups:
            g['link'] = g['_links']['self']['href']
            del g['_links']
            del g['type']
        fractions_df = pd.DataFrame(party_groups)
        fractions_df.to_parquet(path)
        print(f"Saved fractions data to {path}")
    return fractions_df
