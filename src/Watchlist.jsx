import React from 'react'
import { useEffect } from 'react'
import './Watchlist.css'
import UserHeader from './UserHeader'
import { supabase } from './supabase'
const Watchlist = () => {
    const mail=localStorage.getItem("userEmail");
    console.log(mail);
    const fetchWatchlist=async()=>{
        const {data,error}=await supabase
        .from('watchlist')
        .select('*')
        .eq('email',mail);
        console.log(data);
    }

    const fetchMovies=async(id)=>{
        const {data,error}=await supabase
        .from('movies')
        .select('*')
        .eq('id',id);
        console.log(data);
    }
    useEffect(()=>{
        fetchWatchlist();
    },[])
  return (
    <>
    <UserHeader></UserHeader></>
    
  )
}

export default Watchlist