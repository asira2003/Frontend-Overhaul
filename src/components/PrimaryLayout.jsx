import React from "react";
import { Outlet, useNavigation } from "react-router-dom";
import Header from "./PrimaryHeader";
import Footer from "./PrimaryFooter";
import Throbber from "./throbbers/FullscreenThrobber.jsx";

export default function PrimaryLayout() {
  const navigation = useNavigation();
  return (
    <>
      {renderThrobber(navigation)}
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

function renderThrobber(navigation) {
  if (navigation.state === "loading") {
    return <Throbber throbberAlignment="center" />;
  }
}
