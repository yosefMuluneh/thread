import { SignIn } from "@clerk/nextjs";

export const dynamicParams = false
export const dynamic = 'force-static'
 
export default function Page() {
  return <SignIn />;
}
