import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

// initial context
const SocketContext = createContext();

// initial instance of socket.io
// pass-in the server
const socket = io('http://localhost:5000'); // disable proxy pointing to the heroku server in package-json if you're gonna use localhost
// const socket = io('https://warm-wildwood-81069.herokuapp.com');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // Run once
  useEffect(() => {
    // first time when the page loads
    // get permission to use video camera and audio of user device
    // @returns a promise
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream); // to be sent over webrtc to other users

        myVideo.current.srcObject = currentStream; // display current user stream
      });

    // listen for and set current userId
    // event would be emited by the server on io-connection
    socket.on('me', (id) => setMe(id));

    // listen for callUser event
    // setCall state to the SDP sent from the server (This would be accessible for both peers)
    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    // create a peer capable of video call
    // intiator: `true` if we're initiating the call, but `false`
    // in-this-case becuase we're answering a call
    // pass in our own stream
    // basicaly answer the call and pass in our own stream
    const peer = new Peer({ initiator: false, trickle: false, stream });

    // listen for once we receive the signal
    // fires when SDP is generated as a result of initializing `new Peer()`
    // SDP - includes details on how the other peer/user can connect to us
    // get the data about that signal
    // fire an `answerCall` event and pass along the our signal
    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    // listen for the other user stream
    // display the other user stream
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    // set remote signal
    // i.e the other persons SDP creds
    peer.signal(call.signal);

    // our current connection is equal to this peer
    connectionRef.current = peer;
  };

  const callUser = (id) => {
    // initiate a call
    // pass-in our stream
    const peer = new Peer({ initiator: true, trickle: false, stream });

    // listen for signal
    // fires when SDP is generated as a result of initializing `new Peer()`
    // SDP - includes details on how the other peer/user can connect to us
    // pass on to the server to pass on to the other user
    // {id:who-to-call,my-signal,my-id,my-name}
    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });

    // listen for the other person's stream
    // display their stream
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    // listen for call Accepted
    // would be emited by the server if
    // the other person accepts my call
    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);

      // set remote signal
      // i.e the other persons SDP creds
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    /**
     * Edge-Case
     * ---------
     * could'nt get it to work to call
     * another user immediately after
     * closing a call with the first user
     *
     * since useEffect(() => {},[]) would only fire once
     *
     * solution
     * --------
     * window.location.reload(); force a reload
     * provides the user with a new Id
     * (triggers useEffect())
     */
    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
