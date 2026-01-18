import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Единый поток решений',
    description: 'Объединяем обсуждения, задачи и файлы, чтобы команда быстрее принимала решения.',
  },
  {
    title: 'Фокус на результате',
    description: 'Понятные next steps, статусы и дедлайны — от идеи до релиза.',
  },
  {
    title: 'Прозрачность для всех',
    description: 'Видимость прогресса для команды и стейкхолдеров без лишних статусов.',
  },
];

const howItWorks = [
  {
    title: 'Соберите контекст',
    description: 'Импортируйте ключевые документы, решения и участников, чтобы стартовать синхронно.',
  },
  {
    title: 'Планируйте действия',
    description: 'Разбивайте обсуждения на задачи с ответственными и сроками.',
  },
  {
    title: 'Отслеживайте прогресс',
    description: 'Видите статус в реальном времени и исключайте ручные отчеты.',
  },
];

const useCases = [
  {
    title: 'Запуск продукта',
    description: 'Соберите команду, согласуйте roadmap и держите всех в курсе релизов.',
  },
  {
    title: 'Customer Success',
    description: 'Фиксируйте обратную связь клиентов и превращайте ее в четкие задачи.',
  },
  {
    title: 'Внутренние проекты',
    description: 'Организуйте инициативы, где участвуют сразу несколько команд.',
  },
];

const testimonials = [
  {
    quote:
      'DevHub стал для нас единым источником правды — маркетинг и продукт работают как одна команда.',
    author: 'Алина, руководитель продукта',
  },
  {
    quote: 'Наконец-то видно, кто и что делает, без бесконечных статус-созвонов.',
    author: 'Дмитрий, тимлид разработки',
  },
  {
    quote: 'За месяц мы ускорили запуск фич на 35%. Команда чувствует результат.',
    author: 'Елена, COO',
  },
];

const faqs = [
  {
    question: 'Можно ли начать бесплатно?',
    answer: 'Да, базовый план доступен сразу после регистрации, без карты.',
  },
  {
    question: 'Подходит ли DevHub для распределенных команд?',
    answer: 'Да, все обновления синхронизируются в реальном времени для всех часовых поясов.',
  },
  {
    question: 'Есть ли интеграции?',
    answer: 'Да, мы подключаем календарь, Slack и Jira, чтобы не терять контекст.',
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-950 to-indigo-900 opacity-90" />
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col px-6 pb-20 pt-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                DH
              </div>
              <span className="text-lg font-semibold tracking-wide">DevHub</span>
            </div>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <a className="transition hover:text-white" href="#how-it-works">
                Как это работает
              </a>
              <a className="transition hover:text-white" href="#use-cases">
                Сценарии использования
              </a>
              <a className="transition hover:text-white" href="#testimonials">
                Отзывы
              </a>
              <a className="transition hover:text-white" href="#faq">
                FAQ
              </a>
              <a className="transition hover:text-white" href="#final-cta">
                Начать
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:border-white hover:bg-white/10"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-blue-100"
              >
                Регистрация
              </Link>
            </div>
          </header>

          <main className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
                Workspace для команд продукта
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                DevHub — не просто мессенджер, мы убираем разрыв между обсуждением и действиями
              </h1>
              <p className="mt-6 text-lg text-white/70">
                Собирайте контекст, планы и выполнение в одном пространстве. Больше никаких
                бесконечных чатов без результата — только ясные шаги, исполнители и движение вперед.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
                >
                  Начать бесплатно
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                  Войти в рабочее пространство
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/60">
                <span>• Быстрый онбординг</span>
                <span>• Безопасные команды</span>
                <span>• Прозрачная аналитика</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur">
              <div className="grid gap-6">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-white/20"
                  >
                    <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent p-6">
                <p className="text-sm text-white/80">
                  «DevHub помог нам сократить время от обсуждения до релиза с недель до дней».
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/50">
                  Команда продуктовой разработки
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 py-20" id="how-it-works">
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">Как это работает</span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Пять минут, чтобы перейти от идей к выполнению
          </h2>
          <p className="max-w-2xl text-base text-white/70">
            DevHub собирает обсуждения, решения и задачи в одном потоке, чтобы команда
            концентрировалась на результате.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-blue-500/10"
            >
              <span className="text-xs uppercase tracking-[0.3em] text-blue-200/70">
                Шаг {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm text-white/70">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20" id="use-cases">
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            Сценарии использования
          </span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Работает для команд любого масштаба
          </h2>
          <p className="max-w-2xl text-base text-white/70">
            От запуска новых продуктов до кросс-функциональных инициатив — DevHub адаптируется под
            процессы вашей команды.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{useCase.title}</h3>
              <p className="mt-3 text-sm text-white/70">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20" id="testimonials">
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">Отзывы</span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Команды чувствуют эффект уже в первый месяц
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm text-white/80">“{testimonial.quote}”</p>
              <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/50">
                {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20" id="faq">
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">FAQ</span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Ответы на ключевые вопросы
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6"
            >
              <h3 className="text-base font-semibold text-white">{faq.question}</h3>
              <p className="mt-3 text-sm text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10" id="final-cta">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-transparent p-10 text-center shadow-2xl shadow-blue-500/10">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Готовы объединить команду в одном пространстве?
          </h2>
          <p className="mt-4 text-base text-white/70">
            Создайте рабочее пространство DevHub и начните управлять решениями уже сегодня.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-blue-100"
            >
              Начать бесплатно
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Запросить демо
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
