import { useEffect, useRef } from "react";

export function Receiver() {
    const videoRef = useRef<HTMLVideoElement>(null);
    // const playVideo = (event: any) => {
    //     video.current && video.current.play();
    // };

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "receiver" }));
        };

        socket.onmessage = async (event) => {
            console.log("inside the reciever");
            const message = JSON.parse(event.data);
            const pc: RTCPeerConnection | null = null;
            if (message.type === "createOffer") {
                const pc = new RTCPeerConnection();

                pc.ontrack = async (event) => {
                    console.log("event: ", event);
                    if (videoRef.current) {
                        videoRef.current.srcObject = new MediaStream([
                            event.track,
                        ]);
                        await videoRef.current.play();
                    }
                };

                await pc.setRemoteDescription(message.sdp);

                pc.onicecandidate = (event) => {
                    console.log("icecandidate");
                    if (event.candidate) {
                        socket?.send(
                            JSON.stringify({
                                type: "iceCandidate",
                                candidate: event.candidate,
                            })
                        );
                    }
                };

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(
                    JSON.stringify({
                        type: "createAnswer",
                        sdp: pc.localDescription,
                    })
                );
            } else if (message.type === "iceCandidate") {
                if (pc != null) {
                    // @ts-ignore
                    pc.addIceCandidate(message.candidate);
                }
            }
        };
    }, []);

    return (
        <>
            <div>Receiver</div>
            <video controls width="100%" height="100%" ref={videoRef}></video>
        </>
    );
}
