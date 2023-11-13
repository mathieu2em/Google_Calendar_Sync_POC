// component with a sign in button
// Path: outlook/client_outlook/src/components/SignInButton.tsx
import { useAuth } from "../AuthProvider"; // Import useAuth

const SignInButton: React.FC = () => {
  const { signIn } = useAuth(); // Use the signIn method from useAuth

  return (
    <div className="App">
      <button
        onClick={() => {
          console.log("signIn");
          signIn();
        }}
      >
        Connect to Outlook Calendar
      </button>
    </div>
  );
};

export default SignInButton;
