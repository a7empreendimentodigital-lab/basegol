import { PublicHeader } from "@/components/layout/PublicHeader";

type Props = {
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  mobileLogoUrl?: string | null;
};

/** Header público — renderizado apenas quando o shell público está ativo. */
export function PublicTopBar({ userName, userImage, isLoggedIn, mobileLogoUrl }: Props) {
  return (
    <PublicHeader
      userName={userName}
      userImage={userImage}
      isLoggedIn={isLoggedIn}
      mobileLogoUrl={mobileLogoUrl}
    />
  );
}
