import logo from "../assets/images/logo/logo.png";

export default function PrimaryHeader() {
  return (
    <div className="login-mobile-header">
      <img src={logo} alt="Logo" className="login-mobile-logo" />
      <div className="login-header-mobile-text">
        <h2>Sirima Lanka Pvt. Ltd.</h2>
        <p>Admin Console</p>
      </div>
    </div>
  );
}
