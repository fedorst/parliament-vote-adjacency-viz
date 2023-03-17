import math
from typing import Any, Union, Optional

import numpy as np
import requests
import pandas as pd
import os
from IPython.display import HTML, display

from pandas import DataFrame

adjacencyMetrics = ["count", "jaccards"]

def get_payload(url, verbose=False):
    response = requests.get(url)
    if verbose:
        print(url)
    if response.status_code != 200:
        raise Exception(
            f"Something went wrong with the request. Request returned {response.status_code} : '{response.reason}'.\nCheck the url {url}.")
    payload = response.json()
    return payload


class ParliamentAPI:
    coalitions = {
        "52": ["2022-07-18", "2023-03-14"],
        "51": ["2021-01-26", "2022-07-17"],
        "50": ["2019-04-29", "2021-01-25"],
        "49": ["2016-11-23", "2019-04-28"],
        "48": ["2015-04-09", "2016-11-22"],
        "47": ["2014-03-26", "2015-04-08"]
    }

    def __init__(self):
        self.session_data = {}
        self.coalition_votes_data = {}
        self.coalition_votes_metadata = {}
        self.voter_data = {}
        self.fractions_data = None

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



    def get_session_data(self, coalition: str) -> pd.DataFrame:
        if not self.session_data[coalition]:
            coalition_path = f"coalition_{coalition}"
            if coalition_path not in os.listdir():
                os.mkdir(coalition_path)
            session_path = f"coalition_{coalition}/sessionData.parquet"
            if session_path.split("/")[-1] in os.listdir(coalition_path):
                print(f"Session data already exists in {session_path}")
                session_data = pd.read_parquet(session_path)
            else:
                start_date, end_date = ParliamentAPI.coalitions[coalition]
                session_json = ParliamentAPI.get_session_json(start_date, end_date)
                session_data = ParliamentAPI.transform_session_json(session_json)
                print(f"Saving session data to {session_path}")
                session_data.to_parquet(session_path)
            self.session_data[coalition] = session_data
        return self.session_data[coalition]

    def get_vote_data(vote_json: dict) -> tuple[dict[Any, Any], dict[str, Union[Optional[str], Any]], dict[Any, Any]]:
        voters = vote_json["voters"]
        voters_votes = {}
        voters_data = {}
        for voter in voters:
            uuid = voter["uuid"]
            name = voter["fullName"]
            voters_votes[uuid] = voter["decision"]["code"]
            voters_data[uuid] = {
                "name": name,
                "faction": voter["faction"]["name"],
                "factionId": voter["faction"]["uuid"],
            }

        vote_metadata = {
            "description": vote_json["description"],
            "draftLink": f"https://www.riigikogu.ee/tegevus/eelnoud/eelnou/{vote_json['relatedDraft']['uuid']}" if "relatedDraft" in vote_json else None,
            "draftTitle": vote_json['relatedDraft']['title'] if "relatedDraft" in vote_json else None,
            "present": vote_json["present"],
            "absent": vote_json["absent"],
            "inFavor": vote_json["inFavor"],
            "against": vote_json["against"],
            "neutral": vote_json["neutral"],
            "abstained": vote_json["abstained"]
        }
        return voters_votes, vote_metadata, voters_data

    def get_vote_json(vote_id: str):
        url = f"https://api.riigikogu.ee/api/votings/{vote_id}?lang=et"
        return get_payload(url, verbose=False)

    def pull_coalition_votes(self, selected_coalition: str, excluded_vote_types=None) -> tuple[
        DataFrame, DataFrame, DataFrame]:
        if excluded_vote_types is None:
            excluded_vote_types = ["Kohaloleku kontroll"]
        session_data = self.get_session_data(selected_coalition)
        vote_ids = session_data[~session_data.description.isin(excluded_vote_types)].index
        all_votes_dict = {}
        all_votes_metadata = {}
        all_ids_length = len(vote_ids)
        voter_data_dict = {}

        out = display(progress(0, 100), display_id=True)

        for i in range(all_ids_length):
            vote_id = vote_ids[i]
            vote_json = ParliamentAPI.get_vote_json(vote_id)
            voter_dict, vote_metadata, voters_data = ParliamentAPI.get_vote_data(vote_json)
            all_votes_dict[vote_id] = voter_dict
            all_votes_metadata[vote_id] = vote_metadata
            voter_data_dict.update(voters_data)

            out.update(progress(i, all_ids_length))
        coalition_votes_df = pd.DataFrame.from_dict(all_votes_dict).transpose()
        coalition_votes_metadata = pd.DataFrame.from_dict(all_votes_metadata).transpose()
        voter_data = pd.DataFrame.from_dict(voter_data_dict).transpose()
        return coalition_votes_df, coalition_votes_metadata, voter_data

    def get_coalition_votes(self, selected_coalition: str) -> tuple[
        DataFrame, DataFrame, DataFrame]:

        if not all([selected_coalition in d for d in
                [self.coalition_votes_data, self.coalition_votes_metadata, self.voter_data]]):

            selected_coalition_folder = f"coalition_{selected_coalition}"

            if all(f in os.listdir(selected_coalition_folder) for f in
                   ["votes.parquet", "metadata.parquet", "voters.parquet"]):
                print(f"Votes df found in {selected_coalition_folder}/votes.parquet")
                coalition_votes_df = pd.read_parquet(f"{selected_coalition_folder}/votes.parquet")
                coalition_votes_metadata = pd.read_parquet(f"{selected_coalition_folder}/metadata.parquet")
                voter_data = pd.read_parquet(f"{selected_coalition_folder}/voters.parquet")
            else:
                print("Pulling coalition votes from API")
                coalition_votes_df, coalition_votes_metadata, voter_data = self. \
                    pull_coalition_votes(selected_coalition, excluded_vote_types=["Kohaloleku kontroll"])
                coalition_votes_df.to_parquet(f"{selected_coalition_folder}/votes.parquet")
                coalition_votes_metadata.to_parquet(f"{selected_coalition_folder}/metadata.parquet")
                voter_data.to_parquet(f"{selected_coalition_folder}/voters.parquet")
                print(f"Votes df saved to {selected_coalition_folder}/votes.parquet")

            self.coalition_votes_data[selected_coalition] = coalition_votes_df
            self.coalition_votes_metadata[selected_coalition] = coalition_votes_metadata
            self.voter_data[selected_coalition] = voter_data

        return self.coalition_votes_data[selected_coalition], \
            self.coalition_votes_metadata[selected_coalition], \
            self.voter_data[selected_coalition]

    def get_fractions(self) -> pd.DataFrame:
        if self.fractions_data is None:
            path = "fractions.parquet"
            if path in os.listdir():
                fractions_data = pd.read_parquet(path)
                print(f"Fractions data already exists in {path}.")
            else:
                usergroups_json = get_payload("https://api.riigikogu.ee/api/usergroups")
                party_groups = [g for g in usergroups_json if g['type']['code'] == 'FRAKTSIOON']
                for g in party_groups:
                    g['link'] = g['_links']['self']['href']
                    del g['_links']
                    del g['type']
                fractions_data = pd.DataFrame(party_groups).set_index("uuid")
                fractions_data["colorHex"] = fractions_data["colorHex"].apply(
                    lambda c: "#" + c.lower() if type(c) == str else c)
                fractions_data.to_parquet(path)
                print(f"Saved fractions data to {path}")
            self.fractions_data = fractions_data
        return self.fractions_data


    def calculate_adjacency_value(s1: pd.Series, s2: pd.Series, metric):
        equal_votes = (s1 == s2).dropna()

        if metric == "count":
            return equal_votes.sum()
        elif metric == "jaccards":
            total_common_votes = len(set(s1.dropna().index).union(set(s2.dropna().index)))
            if total_common_votes == 0:
                return 0
            total_equal_votes = equal_votes.sum()
            return total_equal_votes / total_common_votes
        elif metric == "fracMul":
            equal_votes = equal_votes.dropna()
            s1_votes = len(s1.dropna())
            s2_votes = len(s2.dropna())
            if s1_votes == 0 or s2_votes == 0:
                return 0
            total_equal_votes = equal_votes.sum()
            return math.sqrt((total_equal_votes/s1_votes)*(total_equal_votes/s2_votes))

        return 0

    def get_adjacency_matrix_df(self, coalition, metric="count", included_vote_values=["POOLT", "VASTU", "ERAPOOLETU"]) -> pd.DataFrame:
        votes_df, _, _ = self.get_coalition_votes(coalition)
        votes_df_used = votes_df.copy()
        mask = votes_df_used.isin(included_vote_values)
        votes_df_used[~mask] = np.nan
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
                    adjacency_value = ParliamentAPI.calculate_adjacency_value(votes_df_used[name1], votes_df_used[name2], metric)
                    adjacency_matrix[name1][name2] = adjacency_value
                processed_names.add(name1)
        adjacency_matrix_df = pd.DataFrame.from_dict(adjacency_matrix)
        return adjacency_matrix_df


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


def progress(value: int, max=100) -> HTML:
    return HTML("""
        <progress
            value='{value}'
            max='{max}',
            style='width: 100%'
        >
            {value}
        </progress>
    """.format(value=value, max=max))
