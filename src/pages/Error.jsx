import { Link, useNavigation, useNavigate } from "react-router-dom";
import Throbber from "../components/throbbers/FullscreenThrobber";
import SecondaryHeader from "../components/SecondaryHeader";
import SecondaryFooter from "../components/SecondaryFooter";
export default function Error() {
  const navigation = useNavigation();
  const navigate = useNavigate();

  function renderThrobber(navigation) {
    if (navigation.state === "loading") {
      return <Throbber throbberAlignment="center" />;
    }
  }

  return (
    <>
      {renderThrobber(navigation)}
      <SecondaryHeader />
      <section className="error-page">
        <div className="error-card">
          <div className="error-code">404</div>
          <h2 className="error-title">Page not found</h2>
          <p className="error-desc">
            We couldn't find the page you're looking for. It may have been
            moved, deleted, or the URL might be incorrect.
          </p>
          <div className="error-actions">
            <Link to="/" className="error-btn primary">
              <i className="fa-solid fa-house"></i>
              <span>Go to Home</span>
            </Link>
            <button onClick={() => navigate(-1)} className="error-btn outline">
              <i className="fa-solid fa-arrow-left"></i>
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </section>
      <SecondaryFooter />
    </>
  );
}
