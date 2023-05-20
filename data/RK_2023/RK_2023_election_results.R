library(rvest)
library(dplyr)

table_final = data.frame()

# for every constituency (12 total)
for(i in 1:12){
  
  # html request
  page = read_html(paste0(paste0("https://rk2023.valimised.ee/et/detailed-voting-result/result-", i), ".html"))
  
  # get raw table
  table_raw = html_node(page, xpath = "/html/body/section/div/div[3]/div[2]")  %>% 
    html_table()
  
  # extract names of the parties
  start = which(table_raw[, 1] == "Erakond")[1] + 1
  end = which(table_raw[, 1] == "Kõik kokku")[1] - 1
  parties = table_raw[start:end, 1][[1]]
  
  # extract where actual voting data begins
  start = which(table_raw[, 1] == "Reg nr")[1]
  end = nrow(table_raw)
  table_raw = table_raw[start:end, ]
  
  # find number of candidates in each party
  numeric_rows = c(!is.na(as.numeric(table_raw[[1]])), FALSE)
  party_lens = diff(which(numeric_rows == FALSE))
  party_lens = party_lens[c(TRUE, FALSE)] - 1
  
  # extract voting data with ALL VOTES ONLY
  table_const = table_raw[!is.na(as.numeric(table_raw[[1]])), ]
  table_const = table_const[, 1:3]
  colnames(table_const) = c("candidate_nr", "candidate_name", "candidate_votes")
  table_const$candidate_votes = as.numeric(table_const$candidate_votes)
  table_const$candidate_nr = as.numeric(table_const$candidate_nr)
  
  # add party name to candidate
  table_const$party = rep(parties, times = party_lens)
  
  # add candidate position in party list
  positions = c()
  for (party in parties){
    table_party = table_const[table_const$party == party, ]
    positions = c(positions, rank(table_party$candidate_nr))
  }
  
  table_const$candidate_position = positions
  
  # calculate number of votes for each party and add to table_const
  table_party_votes = table_const %>%
    group_by(party) %>% 
    summarise(party_votes_const = sum(candidate_votes))
  
  table_const = merge(table_const, table_party_votes)
  
  # calculate the proportion of votes for each candidate in their party
  table_const$prop_candidate_votes_party = table_const$candidate_votes/table_const$party_votes_const
  
  # calculate the proportion of votes for each candidate in the whole constituency
  table_const$prop_candidate_votes_constituency = table_const$candidate_votes/sum(table_const$candidate_votes)
  
  # add constituency
  table_const$constituency = i
  
  # append constituency data to final dataframe
  table_final = rbind(table_final, table_const)
  
}

write.csv2(table_final, "RK_2023_election_results.csv", row.names = FALSE)




