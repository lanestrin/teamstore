import { Outlet } from "react-router-dom";

import PreviewBanner from "../../components/preview-banner/PreviewBanner";

export default function RootLayout() {
  return (
    <>
      <PreviewBanner />
      <Outlet />
    </>
  );
}
