import { Box, FormControl, InputLabel, MenuItem, Select } from "@suid/material";
import {For} from "solid-js";
import coalitionData from "/data/coalitionData";

export default function CoalitionSelect({ selectedCoalition, selectCoalition }) {

    const handleChange = (event) => {
        selectCoalition(event.target.value);
    };

    return (
        <Box sx={{ minWidth: 220, maxWidth: 440 }} >
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Coalition</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={selectedCoalition()}
                    label="Age"
                    onChange={handleChange}
                >
                    <For each={Object.keys(coalitionData)}>{(coalitionId) =>
                        <MenuItem value={coalitionId}>{`${coalitionId}: (${coalitionData[coalitionId].period}) ${coalitionData[coalitionId].participantsShort}`}</MenuItem>
                    }
                    </For>
                </Select>
            </FormControl>
        </Box>
    );
}