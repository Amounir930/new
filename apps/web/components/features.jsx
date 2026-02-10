const features = [
  {
    title: 'Multi-Tenant Architecture',
    description:
      'Each tenant gets isolated database schema. True SaaS scalability.',
    icon: '🏢',
  },
  {
    title: 'Mobile App Included',
    description:
      'Server-Driven UI means one app works for all tenants instantly.',
    icon: '📱',
  },
  {
    title: 'Enterprise Security',
    description:
      'S1-S8 security protocols. Audit logging, encryption, rate limiting.',
    icon: '🛡️',
  },
  {
    title: '60-Second Provisioning',
    description:
      'From payment to live store in under a minute. Fully automated.',
    icon: '⚡',
  },
];
export function Features() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Built for Scale</h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to run a modern e-commerce platform
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl">{feature.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
