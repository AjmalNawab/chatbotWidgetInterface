const Message = ({ message, sender }) => {
  return (
    <div className={`message ${sender}`}>
      <p>{message}</p>
    </div>
  );
};

// Inside ChatWidget
<Message message="Hello!" sender="user" />;
