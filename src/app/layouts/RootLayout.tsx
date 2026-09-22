import { Outlet } from "react-router-dom";
import PreviewBanner from "./components/PreviewBanner/PreviewBanner";

export default function RootLayout() {
  return (
    <>
      <PreviewBanner />
      <Outlet />
    </>
  );
}
