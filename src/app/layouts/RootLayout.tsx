import { Outlet, useLocation } from "react-router-dom";

import PreviewBanner from "../../components/preview-banner/PreviewBanner";

export default function RootLayout() {
  const location = useLocation();
  const isCreateStore = location.pathname.startsWith("/create-store");

  if (isCreateStore) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        <PreviewBanner />

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <>
      <PreviewBanner />
      <Outlet />
    </>
  );
}
