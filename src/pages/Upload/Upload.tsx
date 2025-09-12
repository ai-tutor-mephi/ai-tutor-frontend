import React, { useState, useEffect } from "react";
import { UploadPage } from "./UploadPage";
import { User } from "../../types/user";

type Props = { onLogout: () => void };

const Upload: React.FC<Props> = ({ onLogout }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UploadPage onLogout={() => setUser(null)}/>
  );
};

export default Upload;
