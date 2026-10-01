import { Navigate, useLocation } from "@solidjs/router";

export default function AreaRedirect(props: { from: string; to: string }) {
  const location = useLocation();
  return (
    <Navigate
      href={`${props.to}${location.pathname.slice(props.from.length)}${location.search}${location.hash}`}
    />
  );
}
