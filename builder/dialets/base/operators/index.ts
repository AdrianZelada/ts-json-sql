import {Comparison} from "./comparison";
import {Logical} from "./logical";
import {Fetching} from "./fetching";
import {State} from "./state";

export function Operators( dialect) {
    Comparison(dialect);
    Logical(dialect);
    Fetching(dialect);
    State(dialect);
}