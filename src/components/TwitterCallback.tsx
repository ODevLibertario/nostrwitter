import {useLocation} from "react-router-dom";


export function TwitterCallback(props: any) {
    function useQuery() {
        return new URLSearchParams(useLocation().search);
    }

    let query = useQuery();

    return <div>Please wait... {query.get("oauth_token")} and {query.get("oauth_verifier")} </div>;
}