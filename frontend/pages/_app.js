import "../styles/globals.css";
import { AuthProvider } from "../hooks/useAuth";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1c1f22",
            color: "#eef0f2",
            border: "1px solid #252830",
            borderRadius: "8px",
            fontFamily: "DM Sans, sans-serif",
          },
          success: { iconTheme: { primary: "#c8f061", secondary: "#0d0f11" } },
        }}
      />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
