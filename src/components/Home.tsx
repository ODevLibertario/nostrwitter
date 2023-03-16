import React from "react";
import {nip19} from "nostr-tools";
import {Button, Col, Container, Form, Row} from "react-bootstrap";
import {TwitterBackendService} from "../service/twitter.backend.service";
import {NostrService} from "../service/nostr.service";
import {toast} from "react-toastify";
import {toastFailure, toastSuccess, toastWarn} from "../toast.utils";
import {Tooltip} from 'react-tooltip'


class Home extends React.Component<any, any> {
    private twitterBackendService = new TwitterBackendService()
    private nostrService: NostrService | null = null;

    constructor(props: any) {
        super(props);
        this.state = {loggedInNostr: false, loggedInTwitter: false};
    }

    componentDidMount() {
        console.log("component did mount")
        this.setState({
            ...this.state,
            loggedInNostr: Boolean(localStorage.getItem("loggedInNostr")),
            loggedInTwitter: false,
            nostrNsec: localStorage.getItem("nostrNsec")
            }
        )


        const search = window.location.search;
        let queryParams = new URLSearchParams(search)
        let oauthToken = queryParams.get("oauth_token")
        let oauthVerifier = queryParams.get("oauth_verifier")

        if(oauthToken && oauthVerifier) {
            this.loginTwitter(oauthToken, oauthVerifier)
        }

        if(!this.state.nostrRelays) {
            console.log("Fetching public Nostr relays")
            fetch("https://api.nostr.watch/v1/public").then(response =>
                response.json().then(relays => {
                    this.nostrService = new NostrService(relays)
                })
            ).catch(error => {
                console.log("Failed to fetch public Nostr relays")
                console.log(error)
            })
        }

    }

    render() {
        if (this.state.loggedInNostr && this.state.loggedInTwitter) {
            return this.renderCrosspost()
        } else {
            return this.renderLogin()

        }
    }

    renderCrosspost() {
        return <Container style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '10vh', marginTop: '3%'}}>
            <Row style={{marginTop: '5%', width: '70%'}}>
                <Col>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label style={{color: '#8e2ebe', fontWeight: 'bold'}}>Crosspost</Form.Label>
                            <Form.Control as="textarea" rows={5} placeholder="Write your post" value={this.state.post}
                                          onChange={this.handleChangePost.bind(this)}/>
                        </Form.Group>
                        <Button variant="primary"
                                style={{backgroundColor: '#8e2ebe', fontWeight: 'bold', float: 'right'}}
                                onClick={this.noteAndTweet.bind(this)}>
                            Note & Tweet
                        </Button>
                        <Button variant="primary"
                                style={{backgroundColor: '#8e2ebe', fontWeight: 'bold', float: 'right', marginRight: '1%'}}
                                onClick={this.logout.bind(this)}>
                            Logout
                        </Button>

                    </Form>
                </Col>
            </Row>
        </Container>
    }

    renderLogin(){
        return <Container>
            <Row style={{marginTop: '5%'}}>
                <Col>
                    {!this.state.loggedInNostr && <Form>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label style={{color: '#8e2ebe', fontWeight: 'bold'}}>Login in to Nostr</Form.Label>
                            <Form.Control type="password" placeholder="Enter your Nsec" value={this.state.nostrNsec}
                                          onChange={this.handleChangeNostrNsec.bind(this)}/>
                            <Form.Text className="text-muted" style={{fontWeight: 'bold'}}>
                                Your Nsec is never stored outside of this page's cache or sent over the internet
                            </Form.Text>
                        </Form.Group>
                        <Button variant="primary"
                                style={{backgroundColor: '#8e2ebe', fontWeight: 'bold', float: 'right'}}
                                onClick={this.loginNostr.bind(this)}>
                            Send
                        </Button>
                    </Form>}
                    {this.state.loggedInNostr && <div>
                        <span style={{color: '#8e2ebe', fontWeight: 'bold', fontSize: '20px'}}>Logged in to Nostr with: nsec*****{this.state.nostrNsec.substring(this.state.nostrNsec.length - 5)}</span>
                        <Button variant="primary"
                                style={{backgroundColor: '#8e2ebe', fontWeight: 'bold', float: 'right'}}
                                onClick={this.logoutNostr.bind(this)}>
                            Logout
                        </Button>
                    </div>}
                </Col>
                <Col>
                    {!this.state.loggedInTwitter && <Form>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label style={{color: '#06bfea', fontWeight: 'bold'}}>Login in to Twitter</Form.Label>
                        </Form.Group>
                        <Button variant="primary" style={{
                            backgroundColor: '#06bfea',
                            fontWeight: 'bold',
                            float: 'left',
                            marginRight: '1%',

                        }} onClick={this.authorizeTwitter.bind(this)}>
                            Authorize
                        </Button>
                    </Form>}
                    {this.state.loggedInTwitter && <div>
                        {<span style={{color: '#06bfea', fontWeight: 'bold', fontSize: '20px'}}>Logged in to Twitter</span>}
                        <Button variant="primary"
                                style={{backgroundColor: '#06bfea', fontWeight: 'bold', float: 'right'}}
                                onClick={this.logoutTwitter.bind(this)}>
                            Logout
                        </Button>
                    </div>}
                </Col>
            </Row>
            <Tooltip id="info-tooltip"  style={{ width: '400px' }} />
        </Container>
    }

    authorizeTwitter(){
        toast("Request sent. If nothing happens the backend is waking up, please try again...", toastWarn)
        this.twitterBackendService.getAuthorization().then(authorization => {
            localStorage.setItem("oauth_token_secret", authorization.oauth_token_secret)
            window.open(authorization.url, '_self', 'noopener,noreferrer');
        }).catch(e => console.log(e))
    }

    handleChangeNostrNsec(event: any) {
        this.setState({...this.state, nostrNsec: event.target.value});
    }

    handleChangePost(event: any) {
        this.setState({...this.state, post: event.target.value});
    }

    loginNostr(){
        try {
            const type = nip19.decode(this.state.nostrNsec).type

            if (type == 'nsec') {
                localStorage.setItem("loggedInNostr", 'true')
                localStorage.setItem("nostrNsec", this.state.nostrNsec)
                this.setState({...this.state, loggedInNostr: true})
            } else {
                throw "Invalid nsec"
            }
        } catch (e) {
            throw e
        }
    }

    loginTwitter(oauthToken: string, oauthVerifier: string){
        localStorage.setItem("oauthToken", oauthToken)
        localStorage.setItem("oauthVerifier", oauthVerifier)
        localStorage.setItem("loggedInTwitter", 'true')
        this.setState({...this.state, loggedInTwitter: true})
    }

    logoutTwitter(){
        localStorage.removeItem("oauthToken")
        localStorage.removeItem("oauthVerifier")
        localStorage.removeItem("oauth_token_secret")
        localStorage.setItem("loggedInTwitter", 'false')
        this.setState({...this.state, loggedInTwitter: false})
    }

    logoutNostr(){
        localStorage.setItem("loggedInNostr", 'false')
        localStorage.removeItem("nostrNsec")
        this.setState({...this.state, loggedInNostr: false})
    }

    logout(){
        localStorage.removeItem("oauthToken")
        localStorage.removeItem("oauthVerifier")
        localStorage.setItem("loggedInTwitter", 'false')
        localStorage.setItem("loggedInNostr", 'false')
        localStorage.removeItem("nostrNsec")
        this.setState({
            ...this.state,
            loggedInTwitter: false,
            loggedInNostr: false,
        })

    }

    noteAndTweet(){
        toast("Sending...", toastWarn)
        if(this.nostrService){
            this.nostrService.post(localStorage.getItem("nostrNsec")!!, this.state.post)
            this.twitterBackendService.tweet(
                localStorage.getItem("oauthToken")!,
                localStorage.getItem("oauthVerifier")!,
                localStorage.getItem("oauth_token_secret")!,
                this.state.post).then(r => {
                toast("Success!", toastSuccess)
                sleeper(2000).call(this, undefined).then(r => {
                    toast("Redirecting you to Authorize twitter so you can crosspost again", toastWarn)
                }).then(sleeper(1500)).then(r => {
                    this.authorizeTwitter()
                })
            }
            ).catch(e => console.log(e))

        }else {
            toast("Nostr client initialization failed, refresh the page and try again", toastFailure)
        }

    }


}

function sleeper(ms: number) {
    return function(x: any) {
        return new Promise(resolve => setTimeout(() => resolve(x), ms));
    };
}


    export default Home;