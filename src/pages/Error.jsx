import { Link, useNavigation } from "react-router-dom";
import Throbber from "../components/throbbers/FullscreenThrobber";
import SecondaryHeader from "../components/SecondaryHeader";
import SecondaryFooter from "../components/SecondaryFooter";
export default function Error() {
  const navigation = useNavigation();

  function renderThrobber(navigation) {
    if (navigation.state === "loading") {
      return <Throbber throbberAlignment="center" />;
    }
  }

  return (
    <>
      {renderThrobber(navigation)}
      <SecondaryHeader />
      <section>
        <div className="error">
          <div className="row h-100 align-items-center">
            <div className="col">
              <h2>Oops! Page not Found.</h2>
              <h1>404</h1>
              <p>We can't find the page you're looking for.</p>
              <Link to="/">
                Return to Home Page&nbsp;&nbsp;&nbsp;
                <i className="fa-solid fa-house"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <SecondaryFooter />
    </>
  );
}
