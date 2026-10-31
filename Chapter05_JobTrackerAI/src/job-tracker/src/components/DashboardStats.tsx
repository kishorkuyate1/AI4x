import type { Job } from '../types/job'

export function DashboardStats({ jobs }: { jobs: Job[] }) {
  const stats = [
    { label: 'Total jobs', value: jobs.length },
    { label: 'Wishlist', value: jobs.filter((job) => job.status === 'Wishlist').length },
    { label: 'Applied', value: jobs.filter((job) => job.status === 'Applied').length },
    { label: 'Interviews', value: jobs.filter((job) => job.status === 'Interview').length },
    { label: 'Offers', value: jobs.filter((job) => job.status === 'Offer').length },
    { label: 'Rejected', value: jobs.filter((job) => job.status === 'Rejected').length },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
        </article>
      ))}
    </section>
  )
}
