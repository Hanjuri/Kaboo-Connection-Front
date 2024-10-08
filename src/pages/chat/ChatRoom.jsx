import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import * as styles from "./styled/ChatRoom.styled";
import Text from "../../components/Common/Text";
import ChatMessage from "./ChatMessage.jsx";
import { getChatMessages } from "../../api/ChatMessageCall.js";

const ChatRoom = (props) => {
  const { uuid, name } = props;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);

  const currentUsername = "pjh2"; // 현재 사용자를 pjh2로 가정

  const roomId = props.uuid;

  // 채팅방 메세지 데이터 가져오기
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await getChatMessages(uuid, 0, 10);
        // 메시지 데이터에 isCurrentUser 추가
        const modifiedMessages = Array.isArray(response.data)
          ? response.data.map((msg) => ({
              ...msg,
              isCurrentUser: msg.username === currentUsername,
            }))
          : [];
        setMessages(modifiedMessages);
        console.log("채팅방 메세지 데이터:", modifiedMessages, response);
      } catch (error) {
        console.error("Failed to fetch chat messages", error);
      }
    };
    fetchMessages();
  }, [roomId]);

  // 실시간 웹소켓 연결 및 메세지 보내기
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BASE_URL, {
      path: "/chat/ws", // 서버에서 설정한 경로로 수정
      query: { roomId: uuid },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("WebSocket에 연결되었습니다!");
    });

    newSocket.on("message", (chatMessage) => {
      console.log("WebSocket 메세지 수신", chatMessage);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: chatMessage.id,
          user: chatMessage.username,
          message: chatMessage.message,
          time: new Date().toLocaleTimeString(),
          isCurrentUser: chatMessage.username === currentUsername,
        },
      ]);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        console.log("WebSocket 연결 해제 되었습니다!");
      }
    };
  }, [uuid]); // uuid 변경될 때마다 재연결

  const sendMessage = () => {
    if (message.trim() === "" || !socket || !uuid) {
      return;
    }

    const chatMessage = {
      chatRoomUUID: uuid,
      username: currentUsername, // 현재 접속한 사용자
      nickname: "UserNickName",
      message: message,
    };

    socket.emit("message", chatMessage);

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now(), // 임시로 고유 ID를 부여
        user: chatMessage.username,
        text: chatMessage.message,
        time: new Date().toLocaleTimeString(),
        isCurrentUser: true, // 현재 사용자가 보낸 메시지이므로 true
      },
    ]);

    setMessage("");
  };

  return (
    <styles.TotalWrapper>
      <styles.NameWrapper>
        <Text
          value={props.name}
          fontFamily="KakaoBold"
          fontSize={45}
          color="#000"
        >
          {name}
        </Text>
      </styles.NameWrapper>
      <styles.ChatRoomWrapper>
        {Array.isArray(messages) &&
          messages.map((each, id) => (
            <ChatMessage
              key={each.id}
              name={each.username}
              message={each.message}
              time={each.time}
              isCurrentUser={each.isCurrentUser}
            />
          ))}
      </styles.ChatRoomWrapper>

      <styles.BottomWrapper>
        <styles.InputWrapper>
          <styles.Input
            placeholder={"메세지를 입력하세요..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          ></styles.Input>
        </styles.InputWrapper>
        <styles.SendButton onClick={sendMessage}>{">"}</styles.SendButton>
      </styles.BottomWrapper>
    </styles.TotalWrapper>
  );
};

export default ChatRoom;
