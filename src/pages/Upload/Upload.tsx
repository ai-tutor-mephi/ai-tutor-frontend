import React from "react";
import { UploadPage } from "./UploadPage";

type Props = { onLogout: () => void };

const Upload: React.FC<Props> = ({ onLogout }) => {
  return <UploadPage onLogout={onLogout} />;
};

export default Upload;
