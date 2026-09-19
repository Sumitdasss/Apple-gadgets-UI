
"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Pagination,
  Navigation,
  EffectCreative,
} from "swiper/modules";

import {
  Calculator,
  Truck,
  PackageCheck,
  BadgePercent,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";

const items = [
  {
    image:
      "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FPre-order-18-Pro-Series-slider-6042.jpg&w=1920&q=100",
    alt: "iPhone",
  },
  {
    image:
      "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FCity-%26-EBL-0-slider-6299.png&w=1920&q=100",
    alt: "iPhone",
  },
  {
    image:
      "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FSamsung-s26-Ultra-top-slider1-4089.jpg&w=1920&q=100",
    alt: "Samsung Galaxy",
  },
  {
    image:
      "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FMac-Mini-M6-%26-Mac-Mini-M5-Pro---Top-Slider21-4090.jpg&w=1920&q=100",
    alt: "Mac Mini",
  },
  {
    image:
      "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FMacbook-Air-M5---Top-Slider1-3139.png&w=1920&q=100",
    alt: "MacBook Air",
  },
];

const services = [
  {
    title: "36 Months EMI",
    icon: Calculator,
    color: "text-purple-500",
  },
  {
    title: "Fastest Home Delivery",
    icon: Truck,
    color: "text-yellow-500",
  },
  {
    title: "Exchange Facility",
    icon: PackageCheck,
    color: "text-green-500",
  },
  {
    title: "Best Price Deals",
    icon: BadgePercent,
    color: "text-red-400",
  },
  {
    title: "After-Sales Service",
    icon: Headphones,
    color: "text-orange-500",
  },
];

export default function Banner() {
  return (
    <main className="min-h-screen w-full bg-white">
      <section className="w-full px-3 py-3 sm:px-4 sm:py-5 md:px-5 lg:px-6 xl:px-8">
        <div className="mx-auto w-full max-w-[1440px]">

          {/* ================= HERO AREA ================= */}
          <div
            className="
              grid
              grid-cols-1
              gap-3
              sm:gap-4
              lg:grid-cols-[minmax(0,3fr)_minmax(260px,1.08fr)]
              lg:gap-5
              xl:grid-cols-[minmax(0,3fr)_minmax(300px,1.15fr)]
            "
          >

            {/* ================= MAIN SLIDER ================= */}
            <div
              className="
                group
                relative
                aspect-[16/9]
                w-full
                overflow-hidden
                rounded-xl

                sm:rounded-2xl

                lg:aspect-auto
                lg:h-[430px]

                xl:h-[500px]

                2xl:h-[540px]
              "
            >
              <Swiper
                modules={[
                  Autoplay,
                  Pagination,
                  Navigation,
                  EffectCreative,
                ]}
                effect="creative"
                grabCursor
                loop
                speed={700}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                navigation={{
                  nextEl: ".banner-next",
                  prevEl: ".banner-prev",
                }}
                creativeEffect={{
                  prev: {
                    shadow: true,
                    translate: [0, 0, -400],
                    scale: 0.85,
                    opacity: 0.5,
                  },
                  next: {
                    shadow: true,
                    translate: ["100%", 0, 0],
                  },
                }}
                className="h-full w-full"
              >
                {items.map((item, index) => (
                  <SwiperSlide
                    key={index}
                    className="relative h-full w-full overflow-hidden rounded-xl sm:rounded-2xl"
                  >
                    <img
                      src={item.image}
                      alt={item.alt}
                   
                    
                      className="object-cover object-center"
                    
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* ================= PREVIOUS BUTTON ================= */}
              <button
                type="button"
                className="
                  banner-prev
                  absolute
                  left-2
                  top-1/2
                  z-[50]
                  flex
                  h-8
                  w-8
                  -translate-y-1/2
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-full
                  bg-black/40
                  text-white
                  backdrop-blur-md
                  transition-all
                  duration-300
                  hover:bg-black/70
                  hover:scale-110
                  active:scale-95

                  sm:left-3
                  sm:h-10
                  sm:w-10

                  md:h-11
                  md:w-11

                  lg:left-4
                  lg:h-12
                  lg:w-12
                "
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </button>

              {/* ================= NEXT BUTTON ================= */}
              <button
                type="button"
                className="
                  banner-next
                  absolute
                  right-2
                  top-1/2
                  z-[50]
                  flex
                  h-8
                  w-8
                  -translate-y-1/2
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-full
                  bg-black/40
                  text-white
                  backdrop-blur-md
                  transition-all
                  duration-300
                  hover:bg-black/70
                  hover:scale-110
                  active:scale-95

                  sm:right-3
                  sm:h-10
                  sm:w-10

                  md:h-11
                  md:w-11

                  lg:right-4
                  lg:h-12
                  lg:w-12
                "
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </button>
            </div>

            {/* ================= RIGHT BANNERS ================= */}
            <div
              className="
                grid
                grid-cols-2
                gap-3

                lg:grid-cols-1
                lg:gap-5
              "
            >

              {/* MacBook Banner */}
              <div
                className="
                  relative
                  aspect-[16/9]
                  w-full
                  overflow-hidden
                  rounded-xl
                  bg-gray-100

                  sm:rounded-2xl

                  lg:aspect-auto
                  lg:h-[calc((430px-20px)/2)]

                  xl:h-[calc((500px-20px)/2)]

                  2xl:h-[calc((540px-20px)/2)]
                "
              >
                <img
                  src="https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FMackbook-neo-banner-2216.png&w=640&q=75"
                  alt="MacBook Neo"
              
                  className="
                    object-cover
                    transition-transform
                    duration-500
                    hover:scale-[1.03]
                  "
                
                />
              </div>

              {/* AirPods Banner */}
              <div
                className="
                  relative
                  aspect-[16/9]
                  w-full
                  overflow-hidden
                  rounded-xl
                  bg-black

                  sm:rounded-2xl

                  lg:aspect-auto
                  lg:h-[calc((430px-20px)/2)]

                  xl:h-[calc((500px-20px)/2)]

                  2xl:h-[calc((540px-20px)/2)]
                "
              >
                <img
                  src="https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FAirPods-Pro-(2nd-generation)-USB%E2%80%90C-price-update-6041.png&w=640&q=75"
                  alt="AirPods Pro"
                
                  className="
                    object-cover
                    transition-transform
                    duration-500
                    hover:scale-[1.03]
                  "
                 
                />
              </div>
            </div>
          </div>

          {/* ================= SERVICE BAR ================= */}
          <div
            className="
              mt-4
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white
              shadow-sm

              sm:mt-5
              sm:rounded-2xl

              lg:mt-6
            "
          >
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5">
              {services.map((service, index) => {
                const Icon = service.icon;

                return (
                  <div
                    key={service.title}
                    className={`
                      flex
                      min-h-[72px]
                      items-center
                      justify-center
                      gap-2
                      px-2
                      py-3

                      sm:min-h-[80px]
                      sm:gap-2.5
                      sm:px-3

                      md:min-h-[84px]
                      md:gap-3
                      md:px-4

                      lg:min-h-[88px]

                      ${
                        index !== services.length - 1
                          ? "border-b border-gray-100 sm:border-b-0 sm:border-r"
                          : ""
                      }
                    `}
                  >
                    <Icon
                      strokeWidth={1.6}
                      className={`
                        shrink-0
                        ${service.color}

                        h-6
                        w-6

                        sm:h-7
                        sm:w-7

                        md:h-8
                        md:w-8
                      `}
                    />

                    <span
                      className="
                        max-w-[130px]
                        text-center
                        text-[11px]
                        font-medium
                        leading-tight
                        text-gray-700

                        sm:text-xs

                        md:text-sm
                      "
                    >
                      {service.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}

