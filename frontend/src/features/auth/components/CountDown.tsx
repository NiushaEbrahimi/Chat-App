import { useDispatch, useSelector } from "react-redux";
import { clearRateLimit } from "../../../store/slices/authSlice";
import { useEffect, useState } from "react";
import type {RootState} from "../../../store/index";

export default function CountDown() {
const dispatch = useDispatch();
const rateLimitUntil = useSelector((state: RootState) => state.auth.rateLimitUntil);

const [secondsLeft, setSecondsLeft] = useState(0);

useEffect(() => {
  if (!rateLimitUntil) return;
  const tick = () => {
    const left = Math.ceil((rateLimitUntil - Date.now()) / 1000);
    if (left <= 0) {
      dispatch(clearRateLimit());
    } else {
      setSecondsLeft(left);
    }
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, [dispatch, rateLimitUntil]);

// your button:
    return (
    <div>
        {rateLimitUntil ? `Try again in ${secondsLeft}s` : "Login"}
    </div>
    )
}