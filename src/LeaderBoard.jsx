import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./LeaderBoard.css";
import LeaderBoardTable from "./LeaderBoardTable";
const LeaderBoard = () => {
  const [loading, setLoading] = useState(true);
  // Top 3 avatars still pending to add
  return (
    <section className="leaderboard-wrapper">
         <h1 className="leaderboard-heading">LeaderBoard</h1>
      <LeaderBoardTable />
    </section>
  );}

  export default LeaderBoard;