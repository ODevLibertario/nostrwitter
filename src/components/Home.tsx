import React from "react";
import {nip19} from "nostr-tools";
import {Button, Col, Container, Form, Row} from "react-bootstrap";
import {TwitterBackendService} from "../service/twitter.backend.service";
import {NostrService} from "../service/nostr.service";
import {toast} from "react-toastify";
import {toastFailure} from "../toast.utils";
import info from '../resources/img/info.png';
import {Tooltip} from 'react-tooltip'


class Home extends React.Component<any, any> {

    private twitterBackendService = new TwitterBackendService()
    private nostrService: NostrService | null = null;

    constructor(props: any) {
        super(props);
        this.state = {nostrNsec: undefined, twitterPin: undefined};
    }

    componentDidMount() {
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
                            <Form.Control type="password" placeholder="Enter the authorization PIN"
                                          value={this.state.twitterPin}
                                          onChange={this.handleChangeTwitterPin.bind(this)}/>
                            <Form.Text className="text-muted" style={{fontWeight: 'bold'}}>
                                Your Twitter credentials are not acessed by this application <img src={info} width="20px" data-tooltip-id="info-tooltip" data-tooltip-content="Your Twitter credentials are not acessed by this application, an authorization to post
                                is granted that can be revogated at anytime in the Twitter settings,\n PIN authorization is only applicable for one tweet since
                                authorization keys are not stored." />
                            </Form.Text>
                        </Form.Group>
                        <Button disabled={!this.state.twitterAuthorization} variant="primary"
                                style={{backgroundColor: '#06bfea', fontWeight: 'bold', float: 'right'}}
                                onClick={this.loginTwitter.bind(this)}>
                            Send
                        </Button>
                        <Button variant="primary" style={{
                            backgroundColor: '#06bfea',
                            fontWeight: 'bold',
                            float: 'right',
                            marginRight: '1%'
                        }} onClick={this.authorizeTwitter.bind(this)}>
                            Authorize and Get PIN
                        </Button>
                    </Form>}
                    {this.state.loggedInTwitter && <div>
                        {this.state.twitterPin && <span style={{color: '#06bfea', fontWeight: 'bold', fontSize: '20px'}}>Logged in to Twitter with PIN: **{this.state.twitterPin.substring(this.state.twitterPin.length - 5)}</span>}
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
        this.twitterBackendService.getAuthorization().then(authorization => {
            this.setState({...this.state, twitterAuthorization: authorization});
            window.open(authorization.url, '_blank', 'noopener,noreferrer');
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
                this.setState({...this.state, loggedInNostr: true})
            } else {
                throw "Invalid nsec"
            }
        } catch (e) {
            throw e
        }
    }

    handleChangeTwitterPin(event: any) {
        this.setState({...this.state, twitterPin: event.target.value});
    }

    loginTwitter(){
        this.setState({...this.state, loggedInTwitter: true})
    }

    logoutTwitter(){
        this.setState({...this.state, loggedInTwitter: false, twitterPin: undefined, twitterAuthorization: undefined})
    }

    logoutNostr(){
        this.setState({...this.state, loggedInNostr: false, nostrNsec: undefined})
    }

    logout(){
        this.setState({
            ...this.state,
            loggedInTwitter: false,
            twitterPin: undefined,
            twitterAuthorization: undefined,
            loggedInNostr: false,
            nostrNsec: undefined
        })

    }

    noteAndTweet(){
        if(this.nostrService){
            this.nostrService.post(this.state.nostrNsec, this.state.post)
            this.twitterBackendService.tweet(this.state.twitterPin, this.state.twitterAuthorization, this.state.post).then(r => console.log(r)).catch(e => console.log(e))
            this.logoutTwitter()
        }else {
            toast("Nostr client initialization failed, refresh the page and try again", toastFailure)
        }

    }


}


    export default Home;