import {toast} from "react-toastify";
import {toastFailure, toastSuccess} from "../toast.utils";


export class BackendService {

    public getAuthorization(){
        return fetch(process.env.REACT_APP_TWITTER_BACKEND_HOST +"/twitter/auth").then(response => {
            return response.json().then(json => json)
        }).catch(e => {
            toast("Authorization to Twitter failed: " + e, toastFailure)
        })
    }

    tweet(oauthToken: string, oauthVerifier: string, oauthTokenSecret: string, post: string, imageBase64: string | undefined){
        return fetch(process.env.REACT_APP_TWITTER_BACKEND_HOST +"/twitter/tweet", {
            method: 'POST',
            body: JSON.stringify({
                oauthToken,
                oauthVerifier,
                oauthTokenSecret,
                post,
                imageBase64
            })
        }).then(response => {
            console.log("Tweet sent")
            return response.json().then(json => json)
        }).catch(e => {
           console.log("Tweet publicaton failed" + e)
        })

    }

    ping() {
        console.log("Pinging backend")
        return fetch(process.env.REACT_APP_TWITTER_BACKEND_HOST +"/ping").then(r => r.text())
    }

    upload(imageBase64: string){
        imageBase64 = imageBase64.split(",")[1]

        return fetch(process.env.REACT_APP_TWITTER_BACKEND_HOST +"/imgur/upload", {
            method: 'POST',
            body: JSON.stringify({
                imageBase64
            })
        }).then(response => {
            return response.text().then(link => link)
        }).catch(e => {
            console.log("Image upload failed failed" + e)
        })
    }


}