import React from "react";
import CreateArticle from "./CreateArticle/CreateArticle";

// компонент необхідний, щоб коли користувач переходив від редагування статті до створення дані очищувалися
function UpdateArticle() {
  return <CreateArticle update />;
}

export default UpdateArticle;
