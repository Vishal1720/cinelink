import { useEffect } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

const GoogleCallback = () => {
  const navigate = useNavigate();
const defaultAvatarUrl ="https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg";
  useEffect(() => {
    const handleGoogleLogin = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        console.error(error);
        navigate("/login");
        return;
      }

      const user = data.user;

      const email = user.email;
      const name = user.user_metadata.full_name || "Google User";
      const avatar_url =
        user.user_metadata.avatar_url ||
        "https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg";

        const { data: existingUser } = await supabase
  .from("user")
  .select("email, avatar_url, name")
  .eq("email", email)
  .single();
  
  // 2️⃣ If user EXISTS → update only safe fields
if (existingUser) {

  await supabase
    .from("user")
    .update({
      name: name,           // ✅ column
      
      verified: true,       // ✅ column
    })
    .eq("email", email);    // ✅ condition column

  const finalAvatar = existingUser.avatar_url || avatar_url;
   // Save avatar to localStorage
  localStorage.setItem("userimage", finalAvatar);
} 

// 3️⃣ If NEW user → insert with required columns
else {
  localStorage.setItem("userimage", avatar_url);
  await supabase
    .from("user")
    .insert({
      email: email,               // ✅ column
      name: name,                 // ✅ column
      password: "GOOGLE_AUTH",    // ✅ required column
      avatar_url: avatar_url,     // ✅ column
      verified: true,             // ✅ column
      // gender will take DEFAULT ('male')
      // timestamp will take DEFAULT (now())
    });

}
      localStorage.setItem("role", "user");
      localStorage.setItem("userEmail", email);
      localStorage.setItem("username", name);
      

      navigate("/movielistpage");
    };

    handleGoogleLogin();
  }, [navigate]);

  return <p>Signing you in...</p>;
};

export default GoogleCallback;
