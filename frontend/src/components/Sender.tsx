import { useEffect, useState } from "react";

export function Sender() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "sender" }));
        };
        setSocket(socket);
    }, []);

    async function startSendingVideo() {
        const pc = new RTCPeerConnection();
        pc.onnegotiationneeded = async () => {
            console.log("on negotiation needed");
            const offer = await pc.createOffer(); // SDP
            await pc.setLocalDescription(offer);
            socket?.send(
                JSON.stringify({
                    type: "createOffer",
                    sdp: pc.localDescription,
                })
            );
        };

        pc.onicecandidate = (event) => {
            // console.log(event);
            if (event.candidate) {
                socket?.send(
                    JSON.stringify({
                        type: "iceCandidate",
                        candidate: event.candidate,
                    })
                );
            }
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createAnswer") {
                pc.setRemoteDescription(message.sdp);
            } else if (message.type === "iceCandidate") {
                pc.addIceCandidate(message.candidate);
            }
        };

        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
        });

        console.log("STREAM:", stream.getVideoTracks()[0]);

        pc.addTrack(stream.getVideoTracks()[0]);
    }

    return (
        <div>
            <div>Sender</div>
            <button onClick={startSendingVideo}>Start Streaming</button>
        </div>
    );
}
