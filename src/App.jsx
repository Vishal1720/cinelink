import { useState } from "react";
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
function App() {
  

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
