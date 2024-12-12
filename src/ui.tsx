import {
  Banner,
  Button,
  Columns,
  Container, MiddleAlign,
  render,
  Text, Muted,
  VerticalSpace,
  IconInfo32, IconCheckCircle32
} from '@create-figma-plugin/ui'
import { emit, once, on } from '@create-figma-plugin/utilities'
import { h, Fragment } from 'preact'
import { useCallback, useState, useEffect } from 'preact/hooks'

import { CloseHandler, StartHandler, ProgressHandler, IconCountHandler } from './types'

function Plugin() {
  const [iconCount, setIconCount] = useState<number>(0)
  const [progressCount, setProgressCount] = useState<number>(0)
  const [progress, setProgress] = useState<number>(0)
  const [phase, setPhase] = useState<'initial' | 'finding-icons' | 'updating-description' | 'finished'>('initial')

  useEffect(() => {
    once<IconCountHandler>('ICON_COUNT', function (count: number) {
      setIconCount(count)
      setProgressCount(0)
      setPhase('updating-description')
    })
  
    on<ProgressHandler>('PROGRESS', function (currentProgressCount: number) {
      setProgressCount(currentProgressCount)
      if (iconCount > 0) {
        const newProgress = (currentProgressCount / iconCount) * 100
        setProgress(newProgress)
        if (newProgress >= 100) {
          setPhase('finished')
        }
      }
    })
  }, [iconCount])

  const handleStartButtonClick = useCallback(function () {
    if (phase === 'finished') {
      emit<CloseHandler>('CLOSE')
      return
    }
    emit<StartHandler>('START')
    setPhase('finding-icons')
  }, [phase])

  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>('CLOSE')
  }, [])

  const isStartDisabled = phase === 'finding-icons' || phase === 'updating-description'
  const startButtonLabel = phase === 'finished' ? 'Done' : 'Start'

  return (
    <Container space="medium">
      <style>
        {`
        .spinner {
          margin: 0px auto;
          width: 40px;
          height: 40px;
          border: 4px solid var(--figma-color-bg-tertiary);
          border-top: 4px solid var(--figma-color-text);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .progress-container {
          width: 100%;
          background: var(--figma-color-bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          height: 8px;
          margin-top: 12px;
        }

        .progress-fill {
          height: 100%;
          width: 0%;
          background: var(--figma-color-bg-brand);
        }

        .progress-text {
          margin-top: 12px;
          text-align: left;
        }

        .flex-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .content-area {
          flex: 1; 
          display: flex; 
          flex-direction: column;
          justify-content: flex-start;
        }

        .button-area {
          margin-top: auto; /* Push buttons to the bottom */
        }
        `}
      </style>
      
      <div class="flex-container">
        <div class="content-area">
          <VerticalSpace space="large" />

          {phase === 'finding-icons' && (
            <MiddleAlign>
              <div class="spinner"></div>
              <VerticalSpace space="small" />
              <Text><Muted>Finding icons...</Muted></Text>
            </MiddleAlign>
          )}

          {phase === 'updating-description' && (
            <Fragment>
              <Text class="progress-text">
                Processed: {progressCount}/{iconCount} ({progress.toFixed(2)}%) icons...
              </Text>
              <div class="progress-container">
                <div class="progress-fill" style={`width: ${progress}%`}></div>
              </div>
              <VerticalSpace space="small" />
              <Banner icon={<IconInfo32 />}>
                Figma might be a bit unresponsive. Please wait.
              </Banner>
            </Fragment>
          )}

          {phase === 'finished' && (
            <Banner icon={<IconCheckCircle32 />} variant="success">
              Aliases added to {iconCount} icons.
            </Banner>
          )}

          {phase === 'initial' && (
            <Fragment>
              <Text>
                Adds aliases to Icon descriptions to make Icons easily searchable.
              </Text>
              <VerticalSpace space="small" />
              <Banner icon={<IconInfo32 />}>
                Run from the page containing your Icon components.
              </Banner>
            </Fragment>
          )}
        </div>

        <div class="button-area">
          {(phase === 'initial' || phase === 'finding-icons' || phase === 'updating-description' || phase === 'finished') && (
            <Columns space="extraSmall">
              <Button fullWidth onClick={handleStartButtonClick} disabled={isStartDisabled}>
                {startButtonLabel}
              </Button>
              <Button fullWidth onClick={handleCloseButtonClick} secondary>
                Close
              </Button>
            </Columns>
          )}
          <VerticalSpace space="small" />
        </div>
      </div>
    </Container>
  )
}

export default render(Plugin)