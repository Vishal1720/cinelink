import { useEffect } from "react";
import { supabase } from "./supabase";
import Reg from "./Reg";
import Login from "./Login";
import LandingPage from "./LandingPage";
import AdminPage from "./AdminPage";
import AdminUserAnalytics from "./AdminUserAnalytics";
import MovieDetails from "./MovieDetails";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CastGenre from "./CastGenre";
import UserMovieListPage from "./UserMovieListPage";
import Reviews from "./Reviews";
import Landingheader from "./Landingheader";
import ReviewsSection from "./ReviewsSection";
import GoogleCallback from "./GoogleCallback";
import Watchlist from "./Watchlist";
import EditUserPage from "./EditUserPage";
//  import EditMovies from "./EditMovies";
import ScrollToTop from "./ScrollToTop";
import LeaderBoardTable from "./LeaderBoardTable";
import LeaderBoard from "./LeaderBoard";
import HomePage from "./HomePage";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import MovieDiscussion from "./MovieDiscussion";
import EditMovies from "./EditMovies";
import UploadBanner from "./UploadBanner";
import CastDetails from "./CastDetails";
import RequestsPage from "./RequestPage";
import UserNotificationPage from "./UserNotificationPage";
import AddRecommendation from "./AddRecommendation";
import RecommendationPage from "./RecommendationPage";
import SendNotification from "./SendNotification";
import AboutUs from "./AboutUs";
import UserHeader from "./UserHeader";
import AdminRecommendation from "./AdminRecommendation";
function App() {
  useEffect(() => {
  const checkBlockedUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.user) return;

    const email = sessionData.session.user.email;

    const { data, error } = await supabase
      .from("user")
      .select("account_status")
      .eq("email", email)
      .single();

    if (data?.account_status === "blocked") {
      await supabase.auth.signOut();
      alert("Your account has been blocked by admin.");
      window.location.href = "/Login";
    }
  };

  checkBlockedUser();
}, []);

  return (
    <BrowserRouter>
    <ScrollToTop/>
      <Routes>
        
        
        <Route path="/" element={<LandingPage/>} />
        <Route path="/Login" element={<Login/>} />
        <Route path="/Reg" element={<Reg/>} />
        <Route path="/movielistpage" element={<UserMovieListPage />} />
          <Route path="/adminpage" element={<AdminPage/>} />
          <Route path="/castgenre" element={<CastGenre/>} />
          <Route path="/movie/:id" element={<MovieDetails/>} />
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="/watchlist" element={<Watchlist type="Watchlist"/>} />
          <Route path="/useranalytics" element={<AdminUserAnalytics/>} />
          <Route path="/profile" element={<EditUserPage/>}/>
           {/* <Route path="/edit-movies" element={<EditMovies />} /> */}
          <Route path="/leaderboard" element={<LeaderBoard />} />
          <Route path="/homepage" element={<HomePage/>}/>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
         <Route path="/discussion/:id" element={<MovieDiscussion />} />
         <Route path="/admin-reviews" element={<Reviews />} />
          <Route path="/edit-movies" element={<EditMovies />} />
          <Route path="/upload-banner" element={<UploadBanner />} />
          <Route path="/movie-requests" element={<RequestsPage/>}></Route>
          <Route path="/cast/:castId" element={<CastDetails />} />
          <Route path="/usernotifications" element={<UserNotificationPage />}></Route>
          <Route path="/recommendations" element={<RecommendationPage />}></Route>
          <Route path="/add-recommendation" element={<AddRecommendation />}></Route>
          <Route path="/add-notification" element={<SendNotification />} />
          <Route path="/about-us" element={<><UserHeader/><AboutUs /></>} />
          <Route path="/about" element={<><Landingheader/><AboutUs /></>} />
          <Route path="/AdminRecommendation" element={<AdminRecommendation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
