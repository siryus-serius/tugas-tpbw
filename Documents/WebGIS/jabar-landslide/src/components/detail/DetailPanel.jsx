import AnomalyDetail from './AnomalyDetail';
import EventDetail from './EventDetail';

export default function DetailPanel({ selected, sentinel, stability, onClose }) {
  const { feature, type } = selected;
  const result = stability.byId.get(feature.id);

  return (
    <aside className="detail">
      <button className="close" onClick={onClose} aria-label="Tutup">
        ×
      </button>
      {type === 'event' ? (
        <EventDetail
          feature={feature}
          scenes={sentinel[feature.properties.no]}
          stability={result}
          params={stability.params}
        />
      ) : (
        <AnomalyDetail feature={feature} stability={result} params={stability.params} />
      )}
    </aside>
  );
}
