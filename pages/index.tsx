import Portal from "../components/graphics/Portal";
import { useLogin } from "@privy-io/react-auth";
import Head from "next/head";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useLogin({
    // Navigate the user to the dashboard after logging in
    onComplete: () => router.push("/camera"),
  });

  return (
    <>
      <Head>
        <title>Login · OnlyCam</title>
      </Head>

      <main
        className="flex min-h-screen min-w-full"
        style={{
          backgroundColor: "#FFF3E7",
        }}
      >
        <div
          className="flex bg-privy-light-blue flex-1 p-6 justify-center items-center"
          style={{
            backgroundColor: "#FFF3E7",
          }}
        >
          <div>
            <div>
              <Portal style={{ maxWidth: "100%", height: "auto" }} />
            </div>
            <div className="mt-6 flex justify-center text-center">
              <button
                className="bg-gray-600 hover:bg-gray-700 py-3 px-6 text-white rounded-lg"
                onClick={login}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
