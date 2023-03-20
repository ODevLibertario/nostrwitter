import React from "react";
import {nip19} from "nostr-tools";
import {Button, Col, Container, Form, Row} from "react-bootstrap";
import {BackendService} from "../service/backend.service";
import {NostrService} from "../service/nostr.service";
import {toast} from "react-toastify";
import {toastFailure, toastSuccess, toastWarn} from "../toast.utils";
import {Tooltip} from 'react-tooltip'
import ImageUploading from 'react-images-uploading';


class Home extends React.Component<any, any> {
    private backendService = new BackendService()
    private nostrService: NostrService | null = null;

    private interval: any = undefined;

    constructor(props: any) {
        super(props);
        this.state = {loggedInNostr: false, loggedInTwitter: false};
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            console.log("ping")
            this.backendService.ping().then(r => console.log(r))
        }, 60000)

        let loggedInTwitter = false
        const search = window.location.search;
        let queryParams = new URLSearchParams(search)
        let oauthToken = queryParams.get("oauth_token")
        let oauthVerifier = queryParams.get("oauth_verifier")

        if(oauthToken && oauthVerifier) {
            loggedInTwitter = true
            this.loginTwitter(oauthToken, oauthVerifier)
        }

        this.setState({
                ...this.state,
                loggedInNostr: Boolean(localStorage.getItem("loggedInNostr")),
                loggedInTwitter: loggedInTwitter,
                nostrNsec: localStorage.getItem("nostrNsec")
            }
        )

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
            <Row style={{marginTop: '30%', width: '70%'}}>
                <Col>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label style={{color: '#8e2ebe', fontWeight: 'bold'}}>Crosspost</Form.Label>
                            <Form.Control as="textarea" rows={5} placeholder="Write your post" value={this.state.post}
                                          onChange={this.handleChangePost.bind(this)}/>
                        </Form.Group>

                        <ImageUploading
                            value={this.state.image}
                            onChange={this.onChangeImage.bind(this)}
                            dataURLKey="data_url"
                            maxFileSize={1000000}
                            acceptType={['jpg', 'jpeg', 'gif', 'png']}
                        >
                            {({
                                  imageList,
                                  onImageUpload,
                                  onImageRemoveAll,
                                  onImageUpdate,
                                  onImageRemove,
                                  isDragging,
                                  dragProps,
                              }) => (
                                // write your building UI
                                <div className="upload__image-wrapper"
                                     {...dragProps}
                                     style={{border: "3px dashed #8E2EBE", fontWeight: 'bold', minHeight: '250px', height: 'fit-content', alignItems: 'center', justifyContent: 'center', display: 'flex', marginBottom: '3%'}}>
                                    {imageList.length == 0 && <span onClick={onImageUpload} style={{color: '#8E2EBE', cursor: 'pointer'}}>Click or Drag your image here</span>}
                                    {imageList.map((image, index) => (
                                        <div key={index} className="image-item">
                                            <img src={image['data_url']} alt="" width="250" />
                                            <div className="image-item__btn-wrapper">
                                                <Button style={{backgroundColor:'red', marginLeft: '30%', marginTop:'1%'}} onClick={() => onImageRemove(index)}>Remove</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ImageUploading>
                        <Button variant="primary"
                                style={{backgroundColor: '#8e2ebe', fontWeight: 'bold', float: 'right'}}
                                onClick={this.noteAndTweetWithUpload.bind(this)}>
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

    onChangeImage(image: any, addUpdateIndex: any) {
        // data for submit
        console.log(image, addUpdateIndex);
        this.setState({...this.state, image})
    };

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
        this.backendService.getAuthorization().then(authorization => {
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

    noteAndTweetWithUpload(){
        toast("Sending...", toastWarn)
        if(this.nostrService){
            const imageBase64 = this.state.image[0].data_url
            if(this.state.image && imageBase64){
                toast("Uploading image...", toastWarn)
                this.backendService.upload(imageBase64).then(link => {
                    toast("Upload done", toastSuccess)
                    this.noteAndTweet(imageBase64, link as string)
                })
            }else {
                this.noteAndTweet()
            }
        }else {
            toast("Nostr client initialization failed, refresh the page and try again", toastFailure)
        }

    }

    noteAndTweet(imageBase64?: string, imageLink?: string){
        this.nostrService!.post(localStorage.getItem("nostrNsec")!!, this.state.post, imageLink)
        this.backendService.tweet(
            localStorage.getItem("oauthToken")!,
            localStorage.getItem("oauthVerifier")!,
            localStorage.getItem("oauth_token_secret")!,
            this.state.post,
            imageBase64).then(r => {
                toast("Success!", toastSuccess)
                sleeper(2000).call(this, undefined).then(r => {
                    toast("Redirecting you to Authorize twitter so you can crosspost again", toastWarn)
                }).then(sleeper(1500)).then(r => {
                    this.authorizeTwitter()
                })
            }
        ).catch(e => console.log(e))
    }


}

function sleeper(ms: number) {
    return function(x: any) {
        return new Promise(resolve => setTimeout(() => resolve(x), ms));
    };
}


    export default Home;