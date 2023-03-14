import {useLocation} from "react-router-dom";

let query = useQuery();

function useQuery() {
    return new URLSearchParams(useLocation().search);
}
export function TwitterCallback(props: any) {
    return <div>Please wait... {query.get("oauth_token")} and {query.get("oauth_verifier")} </div>;
}