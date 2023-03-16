import {getEventHash, getPublicKey, nip19, signEvent, SimplePool} from "nostr-tools";
import {toast} from "react-toastify";
import {toastFailure, toastSuccess} from "../toast.utils";

export class NostrService {

    private pool = new SimplePool()
    private readonly connectedRelays:  string[] = []
    private maxRelays = 15;

    constructor(relays: string[]) {
        relays = relays.slice(0, this.maxRelays)

        this.connectedRelays = []
        relays.forEach( relay => {
            this.pool.ensureRelay(relay)
                .then(relay => {
                    this.connectedRelays.push(relay.url)
                })
                .catch(reason => console.log("Failed to connect to relay: "+ reason))
        })
    }

    post(nsec: string, post: string){
        const sk1 = nip19.decode(nsec).data as string
        let pk1 = getPublicKey(sk1)

        let event: any = {
            pubkey: pk1,
            kind: 1,
            created_at: Math.round(Date.now() / 1000),
            content: post + "\n\nhttps://i.imgur.com/rHSPT5Z.jpg",
            tags: []
        }

        event.id = getEventHash(event)
        event.sig = signEvent(event, sk1)

        let pub = this.pool.publish(this.connectedRelays, event)

        pub.on('ok', () => {
            console.log("Note published to a Nostr relay")
            }
        )
        pub.on('failed', (reason: any) => {
            console.log("Note publication to Nostr failed: " + reason)
        })
    }
}