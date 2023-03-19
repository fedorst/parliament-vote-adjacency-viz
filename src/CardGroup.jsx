import {For, Show} from "solid-js";
import {Card, CardContent, IconButton, Typography} from "@suid/material";
import Scrollbars from "solid-custom-scrollbars";
import SearchIcon from "@suid/icons-material/Search";

const clipString = (s, l) => {
    if (!s) return
    if (s.length < l) return s
    return s.substring(0, l-3) + "..."
}


const voteToColor = {
    "POOLT": "green",
    "VASTU": "red",
    "ERAPOOLETU": "yellow"
}

function CardGroup(props) {
    const { identicalVotes, title } = { ...props };

    const sortedVotes = () => {
        let usedVotes = identicalVotes();
        usedVotes?.sort((a, b) => b.date > a.date ? 1 : -1);
        return usedVotes
    }

    return (<div style={{
        width: "38%",
        height: "768px",
        display: 'inline-block',
    }}>
        <Show
            when={sortedVotes() !== undefined}
            keyed
        >
            <Typography variant="h6" style={{ "font-weight": "bold"}}>{title()}</Typography>
            <Scrollbars>
                <For each={sortedVotes()}>{(el) =>
                    <Card sx={{
                        minHeight: 180,
                        maxHeight: 180
                    }} style={{
                        "display": "inline-block",
                        "width": "30%",
                        "margin-right": "6px",
                        "margin-left": "6px",
                        "margin-top": "6px",
                        "margin-bottom": "6px"
                    }}>
                        <CardContent>
                            <Typography sx={{ fontSize: 12 }} color={voteToColor[el.vote]} gutterBottom>
                                {el.vote}
                            </Typography>
                            <Typography variant="h6" sx={{ fontSize: 14 }} component="div" style={{"overflow-wrap": "break-word"}}>
                                {el.description}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 11 }} color="text.secondary">
                                {el.date}
                            </Typography>
                            <Show when={el?.draftTitle} keyed>
                                <Typography variant="body2" sx={{ fontSize: 12 }} color="text.secondary">
                                    {clipString(el?.draftTitle, 110)}
                                    <Show when={el?.draftLink} keyed>
                                        <IconButton
                                            size="small"
                                            color="secondary"
                                            aria-label="look up"
                                            href={el?.draftLink}
                                        >
                                            <SearchIcon fontSize={"small"}/>
                                        </IconButton>
                                    </Show>
                                </Typography>
                            </Show>
                        </CardContent>
                    </Card>
                }</For>
            </Scrollbars>
        </Show>
    </div>)
}
export default CardGroup;
