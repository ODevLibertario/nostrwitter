import {toast} from "react-toastify";
import {toastFailure, toastSuccess} from "../toast.utils";


export class TwitterBackendService {

    public getAuthorization(){
        return fetch(process.env.TWITTER_BACKEND_HOST +"/twitter/auth").then(response => {
            return response.json().then(json => json)
        }).catch(e => {
            toast("Authorization to Twitter failed: " + e, toastFailure)
        })
    }

    tweet(pin: string, authorization: {oauth_token: string, oauth_token_secret: string}, post: string){
        return fetch(process.env.TWITTER_BACKEND_HOST +"/twitter/tweet", {
            method: 'POST',
            body: JSON.stringify({pin, oauth_token: authorization.oauth_token, oauth_token_secret: authorization.oauth_token_secret, post})
        }).then(response => {
            toast("Tweet sent", toastSuccess)
            return response.json().then(json => json)
        }).catch(e => {
            toast("Tweet publicaton failed" + e, toastFailure)
        })

    }


}