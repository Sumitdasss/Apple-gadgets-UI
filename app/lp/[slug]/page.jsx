import LandingPageView from "../../Componant/LandingPageView.jsx";

export default async function LandingPage({ params }) {
  const { slug } = await params;

  return <LandingPageView slug={slug} />;
}