import sys
import json
import numpy as np
import pandas as pd
from .parliamentApiHelpers import ParliamentAPI


def get_links(adjacency_matrix: pd.DataFrame) -> pd.DataFrame:
    np.fill_diagonal(adjacency_matrix.values, np.nan)
    return adjacency_matrix.stack().reset_index().rename(columns={"level_0": "source", "level_1": "target", 0: "value"})

def get_categories(
        fractions_df: pd.DataFrame,
        voter_df: pd.DataFrame
) -> pd.DataFrame:
    return fractions_df[fractions_df.index.isin(voter_df.factionId.unique())][["name", "shortName", "colorHex"]].dropna(
        subset=["colorHex"]).reset_index().rename(columns={"uuid": "id", "colorHex": "color", "shortName": "nameShort"})


def get_nodes(
        voter_df: pd.DataFrame,
        categories_df: pd.DataFrame
) -> pd.DataFrame:
    faction_id_to_id = categories_df.copy().reset_index().set_index("id").rename(columns={"index": "id"})["id"].to_dict()
    keep_cols = ["id", "name", "symbolSize", "value", "category"]
    voter_df["id"] = voter_df.index
    voter_df["symbolSize"] = 12
    voter_df["value"] = 10
    voter_df["category"] = voter_df["factionId"].map(faction_id_to_id)
    return voter_df[keep_cols].sort_values("category")


def generate_json(
        selected_coalition: str,
        votes_data: pd.DataFrame,
        votes_metadata: pd.DataFrame,
        fractions_data: pd.DataFrame,
        adjacency_matrix: pd.DataFrame,
        voter_data: pd.DataFrame
):
    selected_coalition_folder = f"coalition_{selected_coalition}"
    votes_data.reset_index().drop(columns=["index"]).to_json(f"{selected_coalition_folder}/votesMatrix.json")
    votes_metadata.reset_index().drop(columns=["index"]).to_json(f"{selected_coalition_folder}/votesMetadata.json",
                                                                 orient="index")
    categories_data = get_categories(fractions_data, voter_data)
    categories_data.to_json(f"{selected_coalition_folder}/categories.json", orient="records")
    get_links(adjacency_matrix.copy()).to_json(f"{selected_coalition_folder}/links.json", orient="records")
    get_nodes(voter_data, categories_data).to_json(f"{selected_coalition_folder}/nodes.json", orient="records")


if __name__ == "__main__":
    # python generateJson.py 52 jaccards
    args = sys.argv
    if len(args) >= 2:
        coalitions = json.load(open("coalitionData.json"))
        if str(args[1]) in coalitions.keys():
            selectedCoalition = str(args[1])
            pApi = ParliamentAPI()
            coalitionVotesDf, coalitionVotesMetadata, voterData = pApi.get_coalition_votes(selectedCoalition)
            proximityMetric = "jaccards"
            if len(args) >= 3:
                proximityMetric = str(args[2])
            adjacencyMatrix = pApi.get_adjacency_matrix_df(selectedCoalition, metric=proximityMetric,
                                                           included_vote_values=["POOLT", "VASTU", "ERAPOOLETU"])
            fractionsData = pApi.get_fractions()
            generate_json(selectedCoalition, coalitionVotesDf, coalitionVotesMetadata, fractionsData, adjacencyMatrix,
                          voterData)
