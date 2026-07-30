import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const members = [
  {
    name: "Nandha",
    role: "Founder - AI Full Stack Developer",
    description:
      "Building scalable AI-powered systems for modern institutions.",
    image: "/img/N5.png",
    linkedin: "https://www.linkedin.com/in/nandha-dev/",
  },
  {
    name: "Mohammed Mudassir",
    role: "Co-Founder - System Design",
    description:
      "Designing robust architectures that solve real-world academic challenges.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
    linkedin: "https://www.linkedin.com",
  },
];

const Team = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar isPublic={true} />

      <main className="flex-1">
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Meet the Team Behind CampusFlow
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Engineers and innovators building the future of academic
              management systems.
            </p>
          </div>
        </section>

        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Founders
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              The people behind CampusFlow
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {members.map((member) => (
              <article
                key={member.name}
                className="group w-full sm:w-[320px] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-full aspect-[3/4] overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {member.description}
                  </p>

                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    aria-label={`View ${member.name}'s profile`}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 10.07H5.67V18H8.34V10.07ZM7 6A1.55 1.55 0 1 0 7 9.1A1.55 1.55 0 1 0 7 6ZM18.33 13.54C18.33 11.15 16.95 9.86 15.09 9.86C13.59 9.86 12.92 10.69 12.54 11.27V10.07H9.88V18H12.54V13.77C12.54 12.66 12.75 11.58 14.12 11.58C15.47 11.58 15.49 12.84 15.49 13.84V18H18.16L18.33 13.54Z" />
                    </svg>
                    View Profile
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center max-w-3xl mx-auto mt-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Our Team
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              We are a team of passionate developers and problem-solvers focused
              on transforming traditional academic systems into modern, scalable
              digital platforms. At CampusFlow, we combine technology and
              innovation to simplify institutional workflows and enhance
              educational experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
            <article className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Innovation
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Building smart, AI-driven solutions for education.
              </p>
            </article>

            <article className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Scalability
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Designing systems that grow with institutions.
              </p>
            </article>

            <article className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Simplicity
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Making complex workflows easy and efficient.
              </p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Team;
