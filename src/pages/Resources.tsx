// academic support at unc chapel hill. names and links come from the
// university catalog: https://catalog.unc.edu/resources/academic-research/
const resources = [
  {
    name: 'The Learning Center',
    help: 'coaching, tutoring and study strategies for any course',
    url: 'https://learningcenter.unc.edu',
  },
  {
    name: 'The Writing Center',
    help: 'feedback on papers and help becoming a stronger writer',
    url: 'https://writingcenter.unc.edu/',
  },
  {
    name: 'Math Help Center',
    help: 'drop-in support for MATH 110 through MATH 233',
    url: 'https://math.unc.edu/undergraduate/resources/',
  },
  {
    name: 'Thrive@Carolina Campus Hubs',
    help: 'academic advising and support from admission to graduation',
    url: 'https://advising.unc.edu',
  },
  {
    name: 'Center for Student Success',
    help: 'programs for academic and personal growth',
    url: 'https://studentsuccess.unc.edu/',
  },
  {
    name: 'University Libraries',
    help: 'study spaces, collections and research help',
    url: 'https://library.unc.edu/hours/',
  },
  {
    name: 'Carolina Firsts',
    help: 'community and support for first-generation students',
    url: 'https://heellife.unc.edu/organization/cfssprograms',
  },
  {
    name: 'Transfer Student Support',
    help: 'programs to help transfer students settle in',
    url: 'https://studentsuccess.unc.edu/transfer-students/',
  },
]

function Resources() {
  return (
    <div className="flex max-w-4xl flex-col gap-6 p-2">
      <div>
        <h2 className="text-xl font-bold">resources</h2>
        <p className="mt-1 text-sm text-zinc-500">
          academic support at unc chapel hill. asking early is the fastest way to turn a course around.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {resources.map((resource) => (
          <li key={resource.name}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-lg border border-zinc-200 bg-white p-5 transition hover:border-amber-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{resource.name} ↗</span>
              <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">{resource.help}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="text-sm text-zinc-500">
        more in the university catalog:{' '}
        <a
          href="https://catalog.unc.edu/resources/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-amber-600 hover:underline dark:text-amber-400"
        >
          all unc resources ↗
        </a>
      </p>
    </div>
  )
}

export default Resources
