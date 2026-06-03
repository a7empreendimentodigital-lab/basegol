import { PublicHeader } from "@/components/layout/PublicHeader";

type Props = {
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  userRole?: string | null;
  userChampionshipId?: string | null;
  mobileLogoUrl?: string | null;
};

/** Header público — renderizado apenas quando o shell público está ativo. */
export function PublicTopBar({
  userName,
  userImage,
  isLoggedIn,
  userRole,
  userChampionshipId,
  mobileLogoUrl,
}: Props) {
  return (
    <PublicHeader
      userName={userName}
      userImage={userImage}
      isLoggedIn={isLoggedIn}
      userRole={userRole}
      userChampionshipId={userChampionshipId}
      mobileLogoUrl={mobileLogoUrl}
    />
  );
}
