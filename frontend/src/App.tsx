import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

const serverURL = "http://localhost:3000";

type Message = { content: string; name: string };

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");

  const onFormSubmit = () => {
    axios.post(serverURL + "/submit", { name: name, message: message });
  };

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(serverURL + "/messages");
      console.log(res.data);
      setMessages(res.data);
    };

    // make request
    fetch();
  }, []);

  return (
    <div>
      <form
        style={{ display: "flex", flexDirection: "column" }}
        onSubmit={onFormSubmit}
      >
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
        Message
        <input value={message} onChange={(e) => setMessage(e.target.value)} />
        <button type="submit">SEND MESSAGE</button>
      </form>
      {messages.map((msg) => {
        return (
          <div>
            By:
            {msg.name}
            <br />
            {msg.content}
          </div>
        );
      })}
    </div>
  );
}

export default App;
