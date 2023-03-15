import {toast} from "react-toastify";
import {toastFailure, toastSuccess} from "../toast.utils";


export class TwitterBackendService {

    public getAuthorization(){
        return fetch(process.env.REACT_APP_TWITTER_BACKEND_HOST +"/twitter/auth").then(response => {
            return response.json().then(json => json)
        }).catch(e => {
            toast("Authorization to Twitter failed: " + e, toastFailure)
        })
    }

    tweet(oauthToken: string, oauthVerifier: string, oauthTokenSecret: string, post: string){
        return fetch(process.env.REACT_APP_TWITTER_BACKEND_HOST +"/twitter/tweet", {
            method: 'POST',
            body: JSON.stringify({
                oauthToken,
                oauthVerifier,
                oauthTokenSecret,
                post
            })
        }).then(response => {
            toast("Tweet sent", toastSuccess)
            return response.json().then(json => json)
        }).catch(e => {
            toast("Tweet publicaton failed" + e, toastFailure)
        })

    }


}